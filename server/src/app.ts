import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { JWTHandler } from "./jwt";
import cookieParser from "cookie-parser";

const prisma = new PrismaClient();
const app = express();
const jwt = new JWTHandler(process.env.JWT_SECRET || "your-secret-key");

const REFRESH_TOKEN_EXPIRY = 120 * 1000; // 30 * 24 * 60 * 60 * 1000; // 30 days

const ACCESS_TOKEN_EXPIRY = 60; // 15 minutes

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

type Session = {
  userId: number;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      session: Session;
    }
  }
}

const authenticateToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (!jwt.verifyToken(token)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const payload = jwt.getPayload(token) as Session;

  req.session = {
    userId: payload.userId,
    username: payload.username,
  };
  next();
};

const createTokens = async (userId: number, username: string) => {
  const accessToken = jwt.createAccessToken(
    { userId, username } satisfies Session,
    ACCESS_TOKEN_EXPIRY
  );
  const refreshToken = jwt.createRefreshToken();

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    },
  });

  return { accessToken, refreshToken };
};

// Auth routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = await createTokens(
      user.id,
      user.username
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    });

    res.json({ token: accessToken, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = await createTokens(
      user.id,
      user.username
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    });

    res.json({ token: accessToken, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token required" });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(403).json({ error: "Invalid refresh token" });
      return;
    }

    // Delete the used refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Create new tokens
    const { accessToken, refreshToken: newRefreshToken } = await createTokens(
      storedToken.user.id,
      storedToken.user.username
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    });

    res.json({ token: accessToken, username: storedToken.user.username });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Task routes
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.session.userId,
      },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        userId: req.session.userId,
      },
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== req.session.userId) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== req.session.userId) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { completed },
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

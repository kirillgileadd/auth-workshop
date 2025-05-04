import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import {PrismaClient} from "@prisma/client";
import {ServerUnaryCall, ServiceError, status} from '@grpc/grpc-js';
import { JWTHandler } from "./jwt";

const prisma = new PrismaClient();
const jwt = new JWTHandler(process.env.JWT_SECRET || "your-secret-key");


type Session = {
    userId: number;
    username: string;
};

function buildGrpcError(code: status, message: string): ServiceError {
    const err = new Error(message) as ServiceError;
    err.code = code;
    err.details = message;
    err.metadata = new grpc.Metadata();
    return err;
}

export const authenticateCall = (
    call: ServerUnaryCall<any, any>
): { error?: ServiceError; session?: Session } => {
    const authHeader = call.metadata.get('authorization')[0] as string | undefined;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return { error: buildGrpcError(status.UNAUTHENTICATED, 'Authentication required') };
    }

    if (!jwt.verifyToken(token)) {
        return { error: buildGrpcError(status.UNAUTHENTICATED, 'Invalid token') };
    }

    const payload = jwt.getPayload(token) as Session;

    return {
        session: {
            userId: payload.userId,
            username: payload.username,
        },
    };
};


const PROTO_PATH = path.join(__dirname, '../proto/tasks.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const taskProto = grpc.loadPackageDefinition(packageDefinition).tasks as any;

const taskService = {
    GetTasks: async (
        call: grpc.ServerUnaryCall<any, any>,
        callback: grpc.sendUnaryData<any>
    ) => {
        const { error, session } = authenticateCall(call);

        if (error) {
            callback(error, null);
            return;
        }

        const tasks = await prisma.task.findMany({
            where: {
                userId: session!.userId,
            },
        });

        callback(null, { tasks });
    },
};

const server = new grpc.Server();
server.addService(taskProto.TasksService.service, taskService);

const PORT = '0.0.0.0:50051';
server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`🚀 gRPC сервер запущен на ${PORT}`);
    server.start();
});

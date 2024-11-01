import { PrismaClient } from "@prisma/client";

const db = {
    prisma: new PrismaClient(),
};
export default db
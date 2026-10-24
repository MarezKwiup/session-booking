import { env } from '../src/config/env';
import { connectDB, disconnectDB } from '../src/config/db';
import { UserModel } from '../src/models/user.model';
import { TeacherModel } from '../src/models/teacher.model';
import { SessionModel } from '../src/models/session.model';

async function main() {
    await connectDB(env.MONGODB_URI);
    for (const model of [UserModel, TeacherModel, SessionModel]) {
        await model.syncIndexes();
        const names = (await model.listIndexes()).map((i) => i.name);
        console.log(`${model.modelName}: `, names.join(', '));
    }
    await disconnectDB();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
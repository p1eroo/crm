"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskComment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Task_1 = require("./Task");
const User_1 = require("./User");
class TaskComment extends sequelize_1.Model {
}
exports.TaskComment = TaskComment;
TaskComment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    taskId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'task_comments',
    timestamps: true,
});
TaskComment.belongsTo(Task_1.Task, { foreignKey: 'taskId', as: 'Task' });
TaskComment.belongsTo(User_1.User, { foreignKey: 'userId', as: 'User' });
Task_1.Task.hasMany(TaskComment, { foreignKey: 'taskId', as: 'Comments' });

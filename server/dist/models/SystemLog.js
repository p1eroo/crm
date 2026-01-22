"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class SystemLog extends sequelize_1.Model {
}
exports.SystemLog = SystemLog;
SystemLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    action: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    entityType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    entityId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    details: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'systemLogs',
    timestamps: true,
    updatedAt: false, // Solo createdAt
});
SystemLog.belongsTo(User_1.User, { foreignKey: 'userId', as: 'User' });

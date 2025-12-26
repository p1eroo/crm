"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Automation = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Automation extends sequelize_1.Model {
}
exports.Automation = Automation;
Automation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    trigger: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    conditions: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    actions: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'draft'),
        defaultValue: 'draft',
    },
    ownerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'automations',
    timestamps: true,
});
Automation.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'Owner' });

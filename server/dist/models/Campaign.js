"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Campaign = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Campaign extends sequelize_1.Model {
}
exports.Campaign = Campaign;
Campaign.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('email', 'social', 'advertising', 'other'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
        defaultValue: 'draft',
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    budget: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    spent: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    impressions: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    clicks: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    conversions: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
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
    tableName: 'campaigns',
    timestamps: true,
});
Campaign.belongsTo(User_1.User, { foreignKey: 'ownerId', as: 'Owner' });

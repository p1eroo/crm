"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyGoal = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class WeeklyGoal extends sequelize_1.Model {
}
exports.WeeklyGoal = WeeklyGoal;
WeeklyGoal.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    year: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    week: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 53,
        },
    },
    objetivo: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
    },
    facturacionOverride: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'weekly_goals',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['year', 'week'],
        },
    ],
});

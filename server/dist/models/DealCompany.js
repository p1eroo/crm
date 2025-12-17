"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealCompany = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class DealCompany extends sequelize_1.Model {
}
exports.DealCompany = DealCompany;
DealCompany.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dealId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'deals',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    companyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'companies',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'deal_companies',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['dealId', 'companyId'],
        },
    ],
});
exports.default = DealCompany;

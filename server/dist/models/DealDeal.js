"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealDeal = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class DealDeal extends sequelize_1.Model {
}
exports.DealDeal = DealDeal;
DealDeal.init({
    dealId: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'deals',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    relatedDealId: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'deals',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'deal_deals',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['dealId', 'relatedDealId'],
        },
    ],
});
exports.default = DealDeal;

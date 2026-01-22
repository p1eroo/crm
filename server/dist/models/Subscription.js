"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
class Subscription extends sequelize_1.Model {
}
exports.Subscription = Subscription;
Subscription.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
        defaultValue: 'active',
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    renewalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'PEN',
    },
    billingCycle: {
        type: sequelize_1.DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'one-time'),
        defaultValue: 'monthly',
    },
    contactId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'contacts',
            key: 'id',
        },
    },
    companyId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'companies',
            key: 'id',
        },
    },
    createdById: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'subscriptions',
    timestamps: true,
});
Subscription.belongsTo(User_1.User, { foreignKey: 'createdById', as: 'CreatedBy' });
Subscription.belongsTo(Contact_1.Contact, { foreignKey: 'contactId', as: 'Contact' });
Subscription.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' });

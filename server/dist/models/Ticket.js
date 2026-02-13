"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
const Deal_1 = require("./Deal");
class Ticket extends sequelize_1.Model {
}
exports.Ticket = Ticket;
Ticket.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('new', 'open', 'pending', 'resolved', 'closed'),
        defaultValue: 'new',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
    },
    assignedToId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
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
    dealId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'deals',
            key: 'id',
        },
    },
    images: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'tickets',
    timestamps: true,
});
Ticket.belongsTo(User_1.User, { foreignKey: 'assignedToId', as: 'AssignedTo' });
Ticket.belongsTo(User_1.User, { foreignKey: 'createdById', as: 'CreatedBy' });
Ticket.belongsTo(Contact_1.Contact, { foreignKey: 'contactId', as: 'Contact' });
Ticket.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' });
Ticket.belongsTo(Deal_1.Deal, { foreignKey: 'dealId', as: 'Deal' });

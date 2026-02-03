"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Contact_1 = require("./Contact");
const Company_1 = require("./Company");
const Deal_1 = require("./Deal");
class Task extends sequelize_1.Model {
}
exports.Task = Task;
Task.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('call', 'email', 'meeting', 'note', 'todo', 'other'),
        allowNull: false,
        defaultValue: 'todo',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'in progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    googleCalendarEventId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'tasks',
    timestamps: true,
});
Task.belongsTo(User_1.User, { foreignKey: 'assignedToId', as: 'AssignedTo' });
Task.belongsTo(User_1.User, { foreignKey: 'createdById', as: 'CreatedBy' });
Task.belongsTo(Contact_1.Contact, { foreignKey: 'contactId', as: 'Contact' });
Task.belongsTo(Company_1.Company, { foreignKey: 'companyId', as: 'Company' });
Task.belongsTo(Deal_1.Deal, { foreignKey: 'dealId', as: 'Deal' });

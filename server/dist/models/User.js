"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Role_1 = require("./Role");
class User extends sequelize_1.Model {
    // Getter para mantener compatibilidad con código existente que usa user.role
    get role() {
        return this.Role?.name || '';
    }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    usuario: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
    },
    avatar: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    language: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: 'es',
    },
    dateFormat: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: 'es-ES',
    },
    googleAccessToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    googleRefreshToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
    timestamps: true,
});
// Definir la relación con Role
User.belongsTo(Role_1.Role, { foreignKey: 'roleId', as: 'Role' });
// Hook para establecer roleId por defecto si no se proporciona
User.beforeCreate(async (user) => {
    if (!user.roleId) {
        const defaultRole = await Role_1.Role.findOne({ where: { name: 'user' } });
        if (defaultRole) {
            user.roleId = defaultRole.id;
        }
    }
});

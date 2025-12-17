"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGoogleToken = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class UserGoogleToken extends sequelize_1.Model {
}
exports.UserGoogleToken = UserGoogleToken;
UserGoogleToken.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    accessToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    refreshToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    tokenExpiry: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    scope: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'user_google_tokens',
    timestamps: true,
});
// Relación con User
UserGoogleToken.belongsTo(User_1.User, {
    foreignKey: 'userId',
    as: 'User',
});
User_1.User.hasOne(UserGoogleToken, {
    foreignKey: 'userId',
    as: 'GoogleToken',
});

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface UserGoogleTokenAttributes {
  id: number;
  userId: number;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scope: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserGoogleTokenCreationAttributes extends Optional<UserGoogleTokenAttributes, 'id' | 'refreshToken' | 'tokenExpiry' | 'createdAt' | 'updatedAt'> {}

export class UserGoogleToken extends Model<UserGoogleTokenAttributes, UserGoogleTokenCreationAttributes> implements UserGoogleTokenAttributes {
  public id!: number;
  public userId!: number;
  public accessToken!: string;
  public refreshToken?: string;
  public tokenExpiry?: Date;
  public scope!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Relación con User
  public User?: User;
}

UserGoogleToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_google_tokens',
    timestamps: true,
  }
);

// Relación con User
UserGoogleToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User',
});

User.hasOne(UserGoogleToken, {
  foreignKey: 'userId',
  as: 'GoogleToken',
});


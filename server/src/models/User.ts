import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Role } from './Role';

interface UserAttributes {
  id: number;
  email: string;
  usuario: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
  avatar?: string;
  phone?: string;
  language?: string;
  dateFormat?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar' | 'isActive' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public usuario!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public roleId!: number;
  public avatar?: string;
  public phone?: string;
  public language?: string;
  public dateFormat?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Relación con Role
  public Role?: Role;

  // Getter para mantener compatibilidad con código existente que usa user.role
  public get role(): string {
    return this.Role?.name || '';
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    usuario: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'es',
    },
    dateFormat: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'es-ES',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

// Definir la relación con Role
User.belongsTo(Role, { foreignKey: 'roleId', as: 'Role' });

// Hook para establecer roleId por defecto si no se proporciona
User.beforeCreate(async (user) => {
  if (!user.roleId) {
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (defaultRole) {
      user.roleId = defaultRole.id;
    }
  }
});






import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
import { Deal } from './Deal';

export type TaskType = 'call' | 'email' | 'meeting' | 'note' | 'todo' | 'other';

interface TaskAttributes {
  id: number;
  title: string;
  description?: string;
  type: TaskType;
  status: 'pending' | 'in progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignedToId: number;
  createdById: number;
  contactId?: number;
  companyId?: number;
  dealId?: number;
  googleCalendarEventId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'description' | 'type' | 'dueDate' | 'contactId' | 'companyId' | 'dealId' | 'googleCalendarEventId' | 'createdAt' | 'updatedAt'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public type!: TaskType;
  public status!: 'pending' | 'in progress' | 'completed' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public dueDate?: Date;
  public assignedToId!: number;
  public createdById!: number;
  public contactId?: number;
  public companyId?: number;
  public dealId?: number;
  public googleCalendarEventId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public AssignedTo?: User;
  public CreatedBy?: User;
  public Contact?: Contact;
  public Company?: Company;
  public Deal?: Deal;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('call', 'email', 'meeting', 'note', 'todo', 'other'),
      allowNull: false,
      defaultValue: 'todo',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    dealId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'deals',
        key: 'id',
      },
    },
    googleCalendarEventId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);

Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'AssignedTo' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'CreatedBy' });
Task.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Task.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });
Task.belongsTo(Deal, { foreignKey: 'dealId', as: 'Deal' });









import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
import { Deal } from './Deal';

interface ActivityAttributes {
  id: number;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal' | 'contact' | 'company';
  subject: string;
  description?: string;
  userId: number;
  contactId?: number;
  companyId?: number;
  dealId?: number;
  taskId?: number;
  completed?: boolean;
  gmailMessageId?: string;
  gmailThreadId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActivityCreationAttributes extends Optional<ActivityAttributes, 'id' | 'description' | 'contactId' | 'companyId' | 'dealId' | 'taskId' | 'createdAt' | 'updatedAt'> {}

export class Activity extends Model<ActivityAttributes, ActivityCreationAttributes> implements ActivityAttributes {
  public id!: number;
  public type!: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal' | 'contact' | 'company';
  public subject!: string;
  public description?: string;
  public userId!: number;
  public contactId?: number;
  public companyId?: number;
  public dealId?: number;
  public taskId?: number;
  public completed?: boolean;
  public gmailMessageId?: string;
  public gmailThreadId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public User?: User;
  public Contact?: Contact;
  public Company?: Company;
  public Deal?: Deal;
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('call', 'email', 'meeting', 'note', 'task', 'deal', 'contact', 'company'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
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
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tasks',
        key: 'id',
      },
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    gmailMessageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gmailThreadId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'activities',
    timestamps: true,
  }
);

Activity.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Activity.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Activity.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });
Activity.belongsTo(Deal, { foreignKey: 'dealId', as: 'Deal' });




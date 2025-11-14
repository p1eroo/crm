import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';

interface SubscriptionAttributes {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  amount: number;
  currency?: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  contactId?: number;
  companyId?: number;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'description' | 'endDate' | 'renewalDate' | 'currency' | 'contactId' | 'companyId' | 'createdAt' | 'updatedAt'> {}

export class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public status!: string;
  public startDate!: Date;
  public endDate?: Date;
  public renewalDate?: Date;
  public amount!: number;
  public currency?: string;
  public billingCycle!: string;
  public contactId?: number;
  public companyId?: number;
  public createdById!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public CreatedBy?: User;
  public Contact?: Contact;
  public Company?: Company;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending'),
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD',
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'one-time'),
      defaultValue: 'monthly',
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
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
  }
);

Subscription.belongsTo(User, { foreignKey: 'createdById', as: 'CreatedBy' });
Subscription.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Subscription.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });






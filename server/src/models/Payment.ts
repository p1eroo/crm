import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
import { Subscription } from './Subscription';

interface PaymentAttributes {
  id: number;
  amount: number;
  currency?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentDate: Date;
  dueDate?: Date;
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check' | 'other';
  reference?: string;
  description?: string;
  contactId?: number;
  companyId?: number;
  subscriptionId?: number;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'currency' | 'dueDate' | 'reference' | 'description' | 'contactId' | 'companyId' | 'subscriptionId' | 'createdAt' | 'updatedAt'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public amount!: number;
  public currency?: string;
  public status!: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  public paymentDate!: Date;
  public dueDate?: Date;
  public paymentMethod!: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check' | 'other';
  public reference?: string;
  public description?: string;
  public contactId?: number;
  public companyId?: number;
  public subscriptionId?: number;
  public createdById!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public CreatedBy?: User;
  public Contact?: Contact;
  public Company?: Company;
  public Subscription?: Subscription;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'PEN',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
      defaultValue: 'pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'other'),
      defaultValue: 'credit_card',
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subscriptions',
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
    tableName: 'payments',
    timestamps: true,
  }
);

Payment.belongsTo(User, { foreignKey: 'createdById', as: 'CreatedBy' });
Payment.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Payment.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'Subscription' });






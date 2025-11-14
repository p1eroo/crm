import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
import { Deal } from './Deal';

interface TicketAttributes {
  id: number;
  subject: string;
  description?: string;
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToId: number;
  createdById: number;
  contactId?: number;
  companyId?: number;
  dealId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'description' | 'contactId' | 'companyId' | 'dealId' | 'createdAt' | 'updatedAt'> {}

export class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: number;
  public subject!: string;
  public description?: string;
  public status!: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public assignedToId!: number;
  public createdById!: number;
  public contactId?: number;
  public companyId?: number;
  public dealId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public AssignedTo?: User;
  public CreatedBy?: User;
  public Contact?: Contact;
  public Company?: Company;
  public Deal?: Deal;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'open', 'pending', 'resolved', 'closed'),
      defaultValue: 'new',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
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
  },
  {
    sequelize,
    tableName: 'tickets',
    timestamps: true,
  }
);

Ticket.belongsTo(User, { foreignKey: 'assignedToId', as: 'AssignedTo' });
Ticket.belongsTo(User, { foreignKey: 'createdById', as: 'CreatedBy' });
Ticket.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Ticket.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });
Ticket.belongsTo(Deal, { foreignKey: 'dealId', as: 'Deal' });


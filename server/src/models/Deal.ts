import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';

interface DealAttributes {
  id: number;
  name: string;
  amount: number;
  stage: string;
  closeDate?: Date;
  probability?: number;
  ownerId: number;
  contactId?: number;
  companyId?: number;
  pipelineId: number;
  description?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface DealCreationAttributes extends Optional<DealAttributes, 'id' | 'closeDate' | 'probability' | 'contactId' | 'companyId' | 'description' | 'tags' | 'createdAt' | 'updatedAt'> {}

export class Deal extends Model<DealAttributes, DealCreationAttributes> implements DealAttributes {
  public id!: number;
  public name!: string;
  public amount!: number;
  public stage!: string;
  public closeDate?: Date;
  public probability?: number;
  public ownerId!: number;
  public contactId?: number;
  public companyId?: number;
  public pipelineId!: number;
  public description?: string;
  public tags?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Owner?: User;
  public Contact?: Contact;
  public Company?: Company;
}

Deal.init(
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
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    closeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    probability: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    ownerId: {
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
    pipelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'deals',
    timestamps: true,
  }
);

Deal.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' });
Deal.belongsTo(Contact, { foreignKey: 'contactId', as: 'Contact' });
Deal.belongsTo(Company, { foreignKey: 'companyId', as: 'Company' });









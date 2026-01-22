import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ContactCompanyAttributes {
  id: number;
  contactId: number;
  companyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContactCompany extends Model<ContactCompanyAttributes> implements ContactCompanyAttributes {
  public id!: number;
  public contactId!: number;
  public companyId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContactCompany.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'contact_companies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['contactId', 'companyId'],
      },
    ],
  }
);

export default ContactCompany;


import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface CompanyCompanyAttributes {
  id: number;
  companyId: number;
  relatedCompanyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CompanyCompany extends Model<CompanyCompanyAttributes> implements CompanyCompanyAttributes {
  public id!: number;
  public companyId!: number;
  public relatedCompanyId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CompanyCompany.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    relatedCompanyId: {
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
    tableName: 'company_companies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'relatedCompanyId'],
      },
    ],
  }
);

export default CompanyCompany;

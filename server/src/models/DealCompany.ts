import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface DealCompanyAttributes {
  id: number;
  dealId: number;
  companyId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DealCompany extends Model<DealCompanyAttributes> implements DealCompanyAttributes {
  public id!: number;
  public dealId!: number;
  public companyId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DealCompany.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dealId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'deals',
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
    tableName: 'deal_companies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['dealId', 'companyId'],
      },
    ],
  }
);

export default DealCompany;









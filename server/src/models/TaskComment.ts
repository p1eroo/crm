import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Task } from './Task';
import { User } from './User';

interface TaskCommentAttributes {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCommentCreationAttributes extends Optional<TaskCommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class TaskComment extends Model<TaskCommentAttributes, TaskCommentCreationAttributes> implements TaskCommentAttributes {
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public Task?: Task;
  public User?: User;
}

TaskComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'tasks', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'task_comments',
    timestamps: true,
  }
);

TaskComment.belongsTo(Task, { foreignKey: 'taskId', as: 'Task' });
TaskComment.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Task.hasMany(TaskComment, { foreignKey: 'taskId', as: 'Comments' });

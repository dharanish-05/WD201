"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User,{
        foreignKey: 'userId'  
      })
      // define association here
    }

    static addTodo({ title, dueDate, userId }) {
      return this.create({ title: title, dueDate: dueDate, completed: false, userId });
    }

    static async overdue(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }

    static async dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }

    static async dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: new Date(),
          },
          userId,
          completed: false,
        },
      });
    }
    static async remove(id,userId) {
      return this.destroy({
        where: {
          id,
          userId
        },
      });
    }
    static async completed(userId) {
      return this.findAll({
        where: {
          completed: true,
          userId
        },
      });
    }

    static getTodos() {
      return this.findAll();
    }

    setCompletionStatus(completed) {
      return this.update({ completed });
    }
  }
  Todo.init(
    {
      title: {
        type:DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull:true, 
          },
      },
      dueDate:{
        type:DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
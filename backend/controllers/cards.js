const Card = require("../models/card");
const NotFoundError = require("../errors/NotFoundError");
const InvalidError = require("../errors/InvalidError");
const ServerError = require("../errors/ServerError");
const ForbiddenError = require("../errors/ForbiddenError");

module.exports.getCards = (req, res, next) => {
  Card.find({})
    .then((cards) => {
      if (cards.length !== 0) {
        return res.send(cards);
      }
      return res.send({ data: "Нет карточек" });
    })
    .catch((err) =>
      next(new ServerError(`${err.message} - Ошибка по умолчанию`))
    );
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({
    name,
    link,
    owner: req.user._id,
  })
    .then((card) => res.send({ data: card }))
    .catch((err) => {
      if (err.name === "ValidationError") {
        return next(
          new InvalidError(
            "Переданы некорректные данные в методы создания карточки"
          )
        );
      }
      return next(new ServerError(`${err.message} - Ошибка по умолчанию`));
    });
};

module.exports.deleteCard = (req, res, next) => {
  const owner = req.cookies._id;
  Card.findOne({ _id: req.params.cardId })
    .orFail(new Error("NotFound"))
    .then((card) => {
      if (card.owner !== owner) {
        return next(new ForbiddenError("Вы не можете удалить эту карточку"));
      }
      return Card.deleteOne({ _id: req.params.cardId })
        .then((foundCard) => res.send({ data: foundCard, status: "deleted" }))
        .catch((err) =>
          next(new ServerError(`${err.message} - Ошибка по умолчанию`))
        );
    })
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new InvalidError("Невалидный id"));
      }
      if (err.message === "NotFound") {
        return next(new NotFoundError("Карточки с указанным id не существует"));
      }
      return next(new ServerError(`${err.message} - Ошибка по умолчанию`));
    });
};

module.exports.addLikeToCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .orFail(new Error("NotFound"))
    .then((card) => res.send(card))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new InvalidError("Невалидный id"));
      }
      if (err.message === "NotFound") {
        return next(new NotFoundError("Карточки с указанным id не существует"));
      }
      return next(new ServerError(`${err.message} - Ошибка по умолчанию`));
    });
};

module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .orFail(new Error("NotFound"))
    .then((card) => res.send(card))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new InvalidError("Невалидный id"));
      }
      if (err.message === "NotFound") {
        return next(new NotFoundError("Карточки с указанным id не существует"));
      }
      return next(new ServerError(`${err.message} - Ошибка по умолчанию`));
    });
};

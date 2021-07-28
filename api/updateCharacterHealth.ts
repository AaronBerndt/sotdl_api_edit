import { VercelRequest, VercelResponse } from "@vercel/node";
import { updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import axios from "axios";
import { ObjectId } from "mongodb";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { healthChangeAmount, _id } = request.body.data;

    const { data: character } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${_id}`
    );

    const {
      characterState: { health, damage, ...characterStateRest },
      ...rest
    } = character;

    const newDamage =
      damage + healthChangeAmount > health
        ? health
        : damage + healthChangeAmount < 0
        ? 0
        : damage + healthChangeAmount;

    const newCharacterdata = {
      ...rest,

      characterState: {
        damage: newDamage,
        ...characterStateRest,
      },
    };

    const data = await updateCollection("characters", newCharacterdata, {
      _id: new ObjectId(_id),
    });
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);

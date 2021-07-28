import { VercelRequest, VercelResponse } from "@vercel/node";
import { updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import axios from "axios";
import { ObjectId } from "mongodb";
import { max } from "lodash";

const cors = microCors();

type CurrentAffliction = {
  name: string;
};

type Override = {
  id: number;
  name: string;
  value: number;
};

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { overrideType, overrideValue, _id } = request.body.data;

    const { data: character } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/characters?_id=${_id}`
    );

    const {
      characterState: { overrides, ...characterStateRest },
      ...rest
    } = character;

    const idArray: any = overrides.map(({ id }: Override) => id);
    const maxId: any = max(idArray);

    const newCharacterData = {
      ...rest,

      characterState: {
        overrides: [
          ...overrides,
          {
            id: overrides.length === 0 ? 1 : maxId + 1,
            name: overrideType,
            value: overrideValue,
          },
        ],
        ...characterStateRest,
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);

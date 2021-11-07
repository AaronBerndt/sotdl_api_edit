import { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchCollection, updateCollection } from "../utilities/MongoUtils";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";
import { max, tail } from "lodash";

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
    console.log(request.body);
    const { overrideType, overrideValue, _id, action } = request.body.data;
    console.log(overrideType, overrideValue, _id);

    const [characterData] = await fetchCollection("characters", {
      _id: new ObjectId(_id),
    });

    const {
      characterState: { overrides, ...characterStateRest },
      ...rest
    } = characterData;

    const idArray: any = overrides.map(({ id }: Override) => id);
    const maxId: any = max(idArray);

    const overrideValueList = overrides.filter(
      ({ name }) => name === overrideType
    );

    const notOverideValueList = overrides.filter(
      ({ name }) => name !== overrideType
    );

    const newCharacterData = {
      ...rest,
      characterState: {
        overrides:
          action === "add"
            ? [
                ...overrides,
                {
                  id: overrides.length === 0 ? 1 : maxId + 1,
                  name: overrideType,
                  value: overrideValue,
                },
              ]
            : [...notOverideValueList, ...tail(overrideValueList)],

        ...characterStateRest,
      },
    };

    const data = await updateCollection("characters", newCharacterData, {
      _id: new ObjectId(_id),
    });
    console.log(newCharacterData);
    response.status(200).send(newCharacterData);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);

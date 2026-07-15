import { enAuth, zhAuth } from "./resources/auth"
import { enAdmin, zhAdmin } from "./resources/admin"
import { enBase, zhBase } from "./resources/base"
import { enForum, zhForum } from "./resources/forum"
import { enEvent, zhEvent } from "./resources/event"
import { enPack, zhPack } from "./resources/pack"
import { enPost, zhPost } from "./resources/post"
import { enRichText, zhRichText } from "./resources/richText"
import { enTournament, zhTournament } from "./resources/tournament"
import { enUser, zhUser } from "./resources/user"
import { enMappackCreator, zhMappackCreator } from "./resources/mappackCreator"

export const zhTranslation = {
  ...zhBase,
  ...zhAuth,
  ...zhAdmin,
  ...zhForum,
  ...zhEvent,
  ...zhPost,
  ...zhPack,
  ...zhUser,
  ...zhRichText,
  ...zhTournament,
  ...zhMappackCreator,
} as const

export const enTranslation = {
  ...enBase,
  ...enAuth,
  ...enAdmin,
  ...enForum,
  ...enEvent,
  ...enPost,
  ...enPack,
  ...enUser,
  ...enRichText,
  ...enTournament,
  ...enMappackCreator,
} as const

export const resources = {
  zh: {
    translation: zhTranslation,
  },
  en: {
    translation: enTranslation,
  },
} as const

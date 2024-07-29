import * as Sentry from "@sentry/nextjs";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

type SecondParameter<T> = T extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg1: any,
  arg2: infer P,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => any
  ? P
  : never;

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError({ error, path, ctx }) {
    console.error(
      `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.code}-${error.message}`,
    );
    console.log("Let's send this error to Sentry");
    const captureContext: SecondParameter<typeof Sentry.captureException> = {
      tags: {
        code: error.code,
      },
    };
    if (ctx?.session?.user) {
      captureContext.user = {
        id: ctx.session.user.id,
        email: ctx.session.user.email ?? undefined,
        randomNum: Math.random(),
      };
    }

    // send to bug reporting
    Sentry.captureException(error, captureContext);
    console.error("Something went wrong", error);
  },
});

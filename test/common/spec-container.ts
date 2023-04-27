const specsMap: any = {};
let buildingTitle = "Kr_Test";

const beforeAllLabel = "__Kr_Test__beforeAll";
const afterAllLabel = "__Kr_Test__afterAll";
export interface SpecResult {
  success: boolean;
  passCount: number;
  errMsg: string;
}
export function it(title: string, fn: (done: () => void) => void): void {
  if (!specsMap[buildingTitle]) {
    specsMap[buildingTitle] = {};
  }
  if (specsMap[buildingTitle][title]) {
    throw new Error(`case: ${title} has existed!`);
  }
  specsMap[buildingTitle][title] = (): Promise<void> => {
    return new Promise<void>(res => {
      fn(res);
    });
  };
}
export function beforeAll(fn: (done: () => void) => void): void {
  if (!specsMap[buildingTitle]) {
    specsMap[buildingTitle] = {};
  }
  specsMap[buildingTitle][beforeAllLabel] = (): Promise<void> => {
    return new Promise<void>(res => {
      fn(res);
    });
  };
}
export function afterAll(fn: (done: () => void) => void): void {
  if (!specsMap[buildingTitle]) {
    specsMap[buildingTitle] = {};
  }
  specsMap[buildingTitle][afterAllLabel] = (): Promise<void> => {
    return new Promise<void>(res => {
      fn(res);
    });
  };
}
export function spec(title: string, builder: Function): Function {
  return () => {
    buildingTitle = title;
    builder();
  };
}
export function runTests(): Promise<SpecResult> {
  return new Promise<SpecResult>(async (res, rej) => {
    let passCount = 0;
    let specKey: string, itKey: string;
    const successResult = () => {
      return {
        success: true,
        passCount,
        errMsg: "ALL SPECS PASS!"
      };
    };
    const failResult = (err: Error) => {
      return {
        success: false,
        passCount,
        errMsg: `[${specKey}|${itKey}] failed. reason: ${err.message}`
      };
    };
    const printPassMsg = () => {
      console.warn(`[${specKey}|${itKey}] passed.`);
    };
    window.addEventListener("error", ev => {
      res(failResult(ev.error));
    });
    window.addEventListener("unhandledrejection", ev => {
      res(failResult(ev.reason));
    });
    try {
      for (specKey in specsMap) {
        if (specsMap[specKey][beforeAllLabel]) {
          await specsMap[specKey][beforeAllLabel]();
        }
        for (itKey in specsMap[specKey]) {
          if (itKey === beforeAllLabel || itKey === afterAllLabel) {
            continue;
          }
          await specsMap[specKey][itKey]();
          passCount++;
          printPassMsg();
          delete specsMap[specKey][itKey];
        }
        if (specsMap[specKey][afterAllLabel]) {
          await specsMap[specKey][afterAllLabel]();
        }
        delete specsMap[specKey];
      }
    } catch (err) {
      res(failResult(err));
    }
    res(successResult());
  });
}

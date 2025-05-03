/** @type {import('ts-jest').JestConfigWithTsJest} **/
const config = {
  testEnvironment: "node",
  transform: {
  "^.+\.tsx?$": ["ts-jest", {}],
  },
testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
};

export default config;
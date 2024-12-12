import test from "node:test";

export default sum = (a, b) => {
  return a + b;
};

test("must equal to 2", () => {
  expect(sum(1, 1)).toBe(2);
});

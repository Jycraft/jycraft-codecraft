import { expect } from "chai";

import Controller from "../sessions.controller";

describe("Controller", () => {
    it("can be imported", () => {
        expect(Controller).to.be.an('function');
    });
});

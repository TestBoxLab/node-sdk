import TestBoxTrial from "../src/trial";

test("mutations work within a chain", () => {
  const trial = new TestBoxTrial();
  trial.setEmail("pedals@testbox.com").setPassword("a-random-password");

  expect(trial.admin_authentication?.user.email).toBe("pedals@testbox.com");
  expect(trial.admin_authentication?.user.password).toBe("a-random-password");
});

test("mutations work in a functional way", () => {
  let trial = new TestBoxTrial();
  trial = trial.setEmail("pedals@testbox.com");
  trial = trial.setPassword("a-random-password");

  expect(trial.admin_authentication?.user.email).toBe("pedals@testbox.com");
  expect(trial.admin_authentication?.user.password).toBe("a-random-password");
});

test("setting subdomain does what is expected", () => {
  const trial = new TestBoxTrial().setSubdomain("tbx-official");
  expect(trial.start_url_context["subdomain"]).toBe("tbx-official");
});

test("validation does not pass when an admin user is not set up", () => {
  const trial = new TestBoxTrial().setSubdomain("tbx-official");
  expect(trial.validate()).toBeFalsy();
});

test("validation does not pass when no users are set", () => {
  const trial = new TestBoxTrial().setEmail("hello@world.com");
  expect(trial.validate()).toBeFalsy();
});

test("validation does pass when things are good", () => {
  const trial = new TestBoxTrial()
    .setEmail("hello@world.com")
    .addUser({ email: "hello@world.com" });
  expect(trial.validate()).toBeTruthy();
});

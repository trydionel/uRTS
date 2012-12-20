define(function(require) {

    function Agent(options) {
        this.selector = options.selector;
        this.planner = options.planner;

        this.goal = null;
        this.plan = null;
        this.step = 0;
        this.logged = false;
    }

    Agent.prototype.update = function(dt) {
        if (!this.goal) {
            console.log("Choosing new goal");
            this.goal = this.selector.selectGoal();
        }
        if (!this.goal) return;

        if (!this.plan) {
            console.log("Generating plan for goal", this.goal);
            this.plan = this.planner.generatePlan(this.goal);
            this.step = 0;
        }
        if (!this.plan || this.plan.length === 0) return;

        var currentAction = this.plan[this.step];
        currentAction.complete = false;

        if (!this.logged) {
            console.log("Performing action", currentAction, "on entity with state", this.entity);
            this.logged = true;
        }

        currentAction.update(this.entity, dt);

        if (currentAction.complete) {
            this.logged = false;
            this.step++;
        }
        if (this.step > this.plan.length - 1) {
            console.log("Plan complete");
            this.goal = null;
            this.plan = null;
        }
    };

    return Agent;
});
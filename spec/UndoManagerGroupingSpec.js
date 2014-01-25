describe("UndoManager, using grouping", function() {
	var undoManager;
	var testVariable;
	var accessor;

	beforeEach(function() {
		undoManager = new UndoManager();
		testVariable = 0;
		accessor = {
			set: function(param) {
				undoManager.registerUndoAction(this, accessor.set, [testVariable]);
				this._realSet(param);
			},

			_realSet: function(param) {
				testVariable = param;
			}
		};
	});

	it("should be able to begin grouping with different coalesce modes", function() {
		undoManager.beginGrouping();
		undoManager.beginGrouping(UndoManager.COALESCE_MODE.NONE);
		undoManager.beginGrouping(UndoManager.COALESCE_MODE.FIRST);
		undoManager.beginGrouping(UndoManager.COALESCE_MODE.LAST);
		undoManager.beginGrouping(UndoManager.COALESCE_MODE.CONSECUTIVE_DUPLICATES);
		undoManager.beginGrouping(UndoManager.COALESCE_MODE.DUPLICATES);
	});

	it("should be able to end grouping", function() {
		undoManager.endGrouping();
	});

	/**
	 * NONE
	 */
	describe("when multiple actions are registered in a group with coalescing mode NONE", function() {
		beforeEach(function() {

			undoManager.beginGrouping(UndoManager.COALESCE_MODE.NONE);
			for (var i = 0; i < 3; i++) {
				accessor.set(i);
			}
			undoManager.endGrouping();

			spyOn(accessor, '_realSet').andCallThrough();
		});

		it("should indicate that undo is available", function() {
			expect(undoManager.canUndo()).toBeTruthy();
		});

		it("should undo all actions at once", function() {
			undoManager.undo();
			
			for (var i = 0; i < 3; i++) {
				expect(accessor._realSet).toHaveBeenCalledWith(i);
			}
		});
	});

	/**
	 * FIRST
	 */
	describe("when multiple actions are registered in a group with coalescing mode FIRST", function() {
		beforeEach(function() {
			undoManager.beginGrouping(UndoManager.COALESCE_MODE.FIRST);
			for (var i = 0; i < 3; i++) {
				accessor.set(i);
			}
			undoManager.endGrouping();

			spyOn(accessor, '_realSet').andCallThrough();
		});

		it("should undo the first registered action", function() {
			undoManager.undo();
			expect(accessor._realSet).toHaveBeenCalledWith(0);
		});

		it("should not undo the other registered actions", function() {
			undoManager.undo();

			for (var i = 1; i < 3; i++) {
				expect(accessor._realSet).not.toHaveBeenCalledWith(i);
			}
		});
	});

	/**
	 * LAST
	 */
	describe("when multiple actions are registered in a group with coalescing mode LAST", function() {
		beforeEach(function() {
			undoManager.beginGrouping(UndoManager.COALESCE_MODE.LAST);
			for (var i = 0; i < 3; i++) {
				accessor.set(i);
			}
			undoManager.endGrouping();

			spyOn(accessor, '_realSet').andCallThrough();
		});

		it("should undo only the last registered action", function() {
			undoManager.undo();
			
			expect(accessor._realSet).toHaveBeenCalledWith(2);

			for (var i = 0; i < 2; i++) {
				expect(accessor._realSet).not.toHaveBeenCalledWith(i);
			}

			expect(testVariable).toBe(2);
		});
	});
});
describe("UndoManager", function() {
	var undoManager;
	var onChangeSpy;
	var onUndoSpy;
	var onRedoSpy;

	beforeEach(function() {
		undoManager = new UndoManager();
		onChangeSpy = spyOn(undoManager, 'onchange');
		onUndoSpy = spyOn(undoManager, 'onundo');
		onRedoSpy = spyOn(undoManager, 'onredo');
	});

	it("should be able to register actions using a function", function() {
		undoManager.registerUndoFunction(function() {
			//noop
		});
	});

	it("should be able to register actions using a target and parameters", function() {
		var undoFunction = function(){}; //noop

		undoManager.registerUndoAction(null, undoFunction);
	});


	it("should throw an error when undoing nonexistent actions", function() {
		expect(function() {
			undoManager.undo();
		}).toThrow();
	});

	it("should throw an error when redoing nonexistent actions", function() {
		expect(function() {
			undoManager.redo();
		}).toThrow();
	});


	/**
	 * Registering operations
	 */
	describe("when an undo operation is registered", function() {
		var testVariable;

		beforeEach(function() {
			testVariable = 'beforeUndo';

			undoManager.registerUndoFunction(function(){
				testVariable = 'undone';
			});
		});

		it("should indicate that undo is available", function() {
			expect(undoManager.canUndo()).toBeTruthy();
		});

		it("should be able to undo the registered action", function() {
			undoManager.undo();
			expect(testVariable).toBe('undone');
		});

		it("should empty the redo stack", function() {
			undoManager.undo();

			undoManager.registerUndoFunction(function(){
				testVariable = 'undone';
			});

			expect(undoManager.canRedo()).toBeFalsy();
		});

		it("should fire the onchange event", function() {
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});



	/**
	 * Undoing operations
	 */
	describe("when undoing an operation", function() {
		beforeEach(function() {
			testVariable = 'beforeUndo';
			undoManager.registerUndoFunction(function(){
				testVariable = 'undone';
			});
			undoManager.undo();
		});

		it("should undo the change", function() {
			expect(testVariable).toEqual('undone');
		});

		it("should indicate that redo is available", function() {
			expect(undoManager.canRedo()).toBeTruthy();
		});

		it("should fire the onundo event", function() {
			expect(onUndoSpy).toHaveBeenCalled();
		});

		it("should fire the onchange event", function() {
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Clearing the undo stack
	 */
	describe("clearing the undo stack", function() {
		beforeEach(function() {
			undoManager.registerUndoFunction(function(){});
			undoManager.registerUndoFunction(function(){});
		});

		it("should clear the undo stack", function() {
			undoManager.clearUndo();
		});

		it("should indicate that undo is not available", function() {
			undoManager.clearUndo();
			expect(undoManager.canUndo()).toBeFalsy();
		});

		it("should fire the onchange event", function() {
			undoManager.clearUndo();
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Clearing the redo stack
	 */
	describe("when clearing the redo stack", function() {
		beforeEach(function() {
			//Push something on the redo stack
			undoManager.registerUndoFunction(function(){});
			undoManager.registerUndoFunction(function(){});

			undoManager.undo();
			undoManager.undo();
		});

		it("should clear the redo stack", function() {
			undoManager.clearRedo();
		});

		it("should indicate that redo is not available", function() {
			undoManager.clearRedo();
			expect(undoManager.canRedo()).toBeFalsy();
		});

		it("should fire the onchange event", function() {
			undoManager.clearRedo();
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Setting max undo levels
	 */
	describe("max undo levels", function() {
		beforeEach(function() {
			var undoFunction = function(){};
			for (var i = 0; i < 5; i++) {
				undoManager.registerUndoFunction(undoFunction, i);
			}
		});

		describe("when setting the max undo levels", function() {
			it("should remove excessive undo actions", function() {
				undoManager.setMaxUndoLevels(1);
				expect(undoManager.getUndoActionsCount()).toEqual(1);
			});

			it("should return the new max in the getter", function() {
				undoManager.setMaxUndoLevels(3);
				expect(undoManager.getMaxUndoLevels()).toEqual(3);
			});
		});
	});
});
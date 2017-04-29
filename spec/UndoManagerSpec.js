describe("UndoManager", () => {
	var undoManager;
	var onChangeSpy;
	var onUndoSpy;
	var onRedoSpy;

	beforeEach(() => {
		undoManager = new UndoManager();
		onChangeSpy = spyOn(undoManager, 'onchange');
		onUndoSpy = spyOn(undoManager, 'onundo');
		onRedoSpy = spyOn(undoManager, 'onredo');
	});

	it("should be able to register actions using a function", () => {
		undoManager.registerUndoFunction(() => {
			//noop
		});
	});

	it("should be able to register actions using a target and parameters", () => {
		var undoFunction = () => {}; //noop

		undoManager.registerUndoAction(null, undoFunction);
	});


	it("should throw an error when undoing nonexistent actions", () => {
		expect(() => {
			undoManager.undo();
		}).toThrow();
	});

	it("should throw an error when redoing nonexistent actions", () => {
		expect(() => {
			undoManager.redo();
		}).toThrow();
	});


	/**
	 * Registering operations
	 */
	describe("when an undo operation is registered", () => {
		var testVariable;

		beforeEach(() => {
			testVariable = 'beforeUndo';

			undoManager.registerUndoFunction(() => {
				testVariable = 'undone';
			});
		});

		it("should indicate that undo is available", () => {
			expect(undoManager.canUndo()).toBeTruthy();
		});

		it("should be able to undo the registered action", () => {
			undoManager.undo();
			expect(testVariable).toBe('undone');
		});

		it("should empty the redo stack", () => {
			undoManager.undo();

			undoManager.registerUndoFunction(() => {
				testVariable = 'undone';
			});

			expect(undoManager.canRedo()).toBeFalsy();
		});

		it("should fire the onchange event", () => {
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});



	/**
	 * Undoing operations
	 */
	describe("when undoing an operation", () => {
		beforeEach(() => {
			testVariable = 'beforeUndo';
			undoManager.registerUndoFunction(() => {
				testVariable = 'undone';
			});
			undoManager.undo();
		});

		it("should undo the change", () => {
			expect(testVariable).toEqual('undone');
		});

		it("should indicate that redo is available", () => {
			expect(undoManager.canRedo()).toBeTruthy();
		});

		it("should fire the onundo event", () => {
			expect(onUndoSpy).toHaveBeenCalled();
		});

		it("should fire the onchange event", () => {
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Clearing the undo stack
	 */
	describe("clearing the undo stack", () => {
		beforeEach(() => {
			undoManager.registerUndoFunction(() => {});
			undoManager.registerUndoFunction(() => {});
		});

		it("should clear the undo stack", () => {
			undoManager.clearUndo();
		});

		it("should indicate that undo is not available", () => {
			undoManager.clearUndo();
			expect(undoManager.canUndo()).toBeFalsy();
		});

		it("should fire the onchange event", () => {
			undoManager.clearUndo();
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Clearing the redo stack
	 */
	describe("when clearing the redo stack", () => {
		beforeEach(() => {
			//Push something on the redo stack
			undoManager.registerUndoFunction(() => {});
			undoManager.registerUndoFunction(() => {});

			undoManager.undo();
			undoManager.undo();
		});

		it("should clear the redo stack", () => {
			undoManager.clearRedo();
		});

		it("should indicate that redo is not available", () => {
			undoManager.clearRedo();
			expect(undoManager.canRedo()).toBeFalsy();
		});

		it("should fire the onchange event", () => {
			undoManager.clearRedo();
			expect(onChangeSpy).toHaveBeenCalled();
		});
	});


	/**
	 * Setting max undo levels
	 */
	describe("max undo levels", () => {
		beforeEach(() => {
			var undoFunction = () => {};
			for (var i = 0; i < 5; i++) {
				undoManager.registerUndoFunction(undoFunction, i);
			}
		});

		describe("when setting the max undo levels", () => {
			it("should remove excessive undo actions", () => {
				undoManager.setMaxUndoLevels(1);
				expect(undoManager.getUndoActionsCount()).toEqual(1);
			});

			it("should return the new max in the getter", () => {
				undoManager.setMaxUndoLevels(3);
				expect(undoManager.getMaxUndoLevels()).toEqual(3);
			});
		});
	});
});

const { eventBus } = require('../events');

describe('Event System', () => {
    test('basic event publishing', () => {
        const callback = jest.fn();
        eventBus.subscribe('test:event', callback);
        eventBus.publish('test:event', { data: 'test' });
        expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });
});

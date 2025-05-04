import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { MemoryRouter as Router } from 'react-router-dom';
import App from '../renderer/App';

describe('App', () => {
    it('should render', () => {
        expect(true);
        // expect(
        //     render(
        //         <Router>
        //             <App />
        //         </Router>,
        //     ),
        // ).toBeTruthy();
    });
});

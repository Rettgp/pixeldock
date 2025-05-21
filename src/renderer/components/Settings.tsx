import { Button } from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const navigate = useNavigate();

    return (
        <Button
            variant="plain"
            startDecorator={<ArrowBackIcon sx={{ 'font-size': 'xx-large' }} />}
            onClick={() => {
                navigate('/');
            }}
            sx={{
                p: 0,
                'font-size': 'xx-large',
                color: 'white',
                'paint-order': 'stroke fill',
                '-webkit-text-stroke': '4px #333',
                '&:hover': {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                },
                paddingBottom: '1rem',
            }}
        >
            Settings
        </Button>
    );
}

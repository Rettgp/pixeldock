import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Input,
    Modal,
    Snackbar,
    Typography,
} from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, ChangeEvent, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import log from 'electron-log/renderer';
import { useNavigate } from 'react-router-dom';
import { CustomGame, Response } from '../../main/StorageType';
import IpcService from '../../ipc/IpcService';

const openFileBrowser = (): Promise<string> => {
    const ipc = new IpcService();
    return ipc.send<string>('open-file', {});
};

export default function GameSettings() {
    const navigate = useNavigate();
    const [games, setGames] = useState<CustomGame[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [formData, setFormData] = useState<CustomGame>({
        _id: uuidv4(),
        name: '',
        exe: '',
        heroPath: '',
    });
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field: string, e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = () => {
        const ipc = new IpcService();
        ipc.send<Response>('custom-games', {
            params: ['add', JSON.stringify(formData)],
        })
            .then((resp) => {
                if (resp.ok) {
                    setGames([...games, formData]);
                    setFormData({
                        _id: uuidv4(),
                        name: '',
                        exe: '',
                        heroPath: '',
                    });
                    setShowModal(false);
                } else {
                    setErrorMessage(`Failed to save game`);
                    setErrorOpen(true);
                }
                return resp;
            })
            .catch((error) => {
                setErrorMessage(`Failed to save game - ${error}`);
                setErrorOpen(true);
            });
    };

    const handleBrowse = async (field: keyof CustomGame) => {
        openFileBrowser()
            .then((path) => {
                if (path) {
                    setFormData((prev) => ({ ...prev, [field]: path }));
                }
                return true;
            })
            .catch((error) => {
                log.error(error);
            });
    };

    const fetchGames = async () => {
        const ipc = new IpcService();
        ipc.send<CustomGame[]>('custom-games', {
            params: ['fetch'],
        })
            .then((fetchedGames) => {
                setGames(fetchedGames);
                return fetchedGames;
            })
            .catch((error) => {
                setErrorMessage(`Failed to fetch games - ${error}`);
            });
    };

    const removeGame = async (id: string) => {
        const ipc = new IpcService();
        ipc.send<Response>('custom-games', {
            params: ['remove', id],
        })
            .then((resp) => {
                return resp;
            })
            .catch((error) => {
                setErrorMessage(`Failed to remove game ${id} - ${error}`);
            });
    };

    useEffect(() => {
        fetchGames();
    }, []);

    return (
        <Box p={2}>
            <Button
                variant="plain"
                startDecorator={
                    <ArrowBackIcon sx={{ 'font-size': 'xx-large' }} />
                }
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
                }}
            >
                Custom Games
            </Button>

            <Grid
                container
                spacing={2}
                direction="column"
                sx={{
                    justifyContent: 'center',
                    alignItems: 'stretch',
                    flexGrow: 1,
                }}
            >
                {/* Add Game Card */}
                <Grid>
                    <Card
                        variant="outlined"
                        onClick={() => setShowModal(true)}
                        sx={{
                            border: '2px dashed grey',
                            height: '5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Typography level="h4">+ Add Game</Typography>
                    </Card>
                </Grid>

                {/* Display each game as a hero image card */}
                {games.map((game, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid key={index}>
                        <Card
                            variant="outlined"
                            sx={{ height: 200, p: 0, overflow: 'hidden' }}
                        >
                            <img
                                src={`local://${game.heroPath}`}
                                alt={game.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <CardContent
                                sx={{
                                    position: 'absolute',
                                    padding: '.5rem',
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    width: '100%',
                                }}
                            >
                                <IconButton
                                    color="danger"
                                    variant="solid"
                                    size="sm"
                                    onClick={() => {
                                        // eslint-disable-next-line no-underscore-dangle
                                        removeGame(game._id);
                                        setGames((prev) =>
                                            prev.filter((_, i) => i !== index),
                                        );
                                    }}
                                    sx={{
                                        position: 'absolute',
                                        top: 5,
                                        right: 20,
                                        zIndex: 2,
                                        backgroundColor:
                                            'rgba(255,255,255,0.8)',
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Typography level="h4" sx={{ color: 'white' }}>
                                    {game.name}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal for adding game */}
            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <Card sx={{ width: 400, p: 3, mx: 'auto', mt: '10%' }}>
                    <Typography level="h4" gutterBottom>
                        Add New Game
                    </Typography>
                    <Input
                        placeholder="Name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e)}
                        sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Input
                            placeholder="Executable Path"
                            value={formData.exe}
                            onChange={(e) => handleChange('exe', e)}
                            sx={{ mb: 2 }}
                        />
                        <Button onClick={() => handleBrowse('exe')}>
                            Browse
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Input
                            placeholder="Hero Image Path"
                            value={formData.heroPath}
                            onChange={(e) => handleChange('heroPath', e)}
                            sx={{ mb: 2 }}
                        />
                        <Button onClick={() => handleBrowse('heroPath')}>
                            Browse
                        </Button>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                            variant="plain"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save</Button>
                    </Box>
                </Card>
            </Modal>
            <Snackbar
                variant="soft"
                color="danger"
                open={errorOpen}
                onClose={() => setErrorOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Typography level="body-sm">{errorMessage}</Typography>
            </Snackbar>
        </Box>
    );
}

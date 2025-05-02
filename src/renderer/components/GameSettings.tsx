import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Input,
    Modal,
    Sheet,
    Stack,
    Typography,
} from '@mui/joy';
import React, { useState, ChangeEvent } from 'react';
import log from 'electron-log/renderer';
import { CustomGame } from '../StorageType';
import IpcService from '../../ipc/IpcService';

const openFileBrowser = (): Promise<string> => {
    const ipc = new IpcService();
    return ipc.send<string>('open-file', {});
};

export default function GameSettings() {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [formData, setFormData] = useState<CustomGame>({
        _id: '0',
        name: '',
        exe: '',
        heroPath: '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // window.electronAPI?.saveGameData(formData);
        setShowModal(false);
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

    return (
        <Box
            height="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Sheet
                variant="outlined"
                sx={{
                    width: 200,
                    height: 200,
                    border: '2px dashed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
                onClick={() => setShowModal(true)}
            >
                <Typography level="title-md" color="neutral">
                    Add Game
                </Typography>
            </Sheet>

            <Modal open={showModal} onClose={() => setShowModal(false)}>
                <Sheet
                    variant="outlined"
                    sx={{
                        maxWidth: 500,
                        mx: 'auto',
                        mt: '10%',
                        p: 3,
                        borderRadius: 'md',
                        boxShadow: 'lg',
                        backgroundColor: 'background.surface',
                    }}
                >
                    <DialogTitle>Add New Game</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2}>
                            <Input
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <Stack direction="row" spacing={1}>
                                <Input
                                    name="executablePath"
                                    placeholder="Executable Path"
                                    value={formData.exe}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => handleBrowse('exe')}
                                >
                                    Browse
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Input
                                    name="heroImagePath"
                                    placeholder="Hero Image Path"
                                    value={formData.heroPath}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => handleBrowse('heroPath')}
                                >
                                    Browse
                                </Button>
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="plain"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="solid" onClick={handleSave}>
                            Save
                        </Button>
                    </DialogActions>
                </Sheet>
            </Modal>
        </Box>
    );
}

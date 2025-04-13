import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Container,
    Paper,
    Grid,
} from "@mui/material";

function App() {
    // Состояния для входных данных
    const [fuel, setFuel] = useState(0);
    const [additives, setAdditives] = useState(0);
    const [currentMix, setCurrentMix] = useState(0);
    const [targetMix, setTargetMix] = useState(0);

    // Функция для расчета количества этанола
    const calculateEthanol = () => {
        const pureFuel = fuel * (1 - additives / 100); // Чистый объем топлива
        const ethanolToAdd =
            (pureFuel * (targetMix / 100 - currentMix / 100)) / (1 - targetMix / 100);
        return ethanolToAdd.toFixed(2); // Округляем до двух знаков
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box textAlign="center" mb={3}>
                    <Typography variant="h4" gutterBottom>
                        Калькулятор этанола
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Рассчитайте количество этанола для создания смеси
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Объем топлива (л)"
                            type="number"
                            value={fuel}
                            onChange={(e) => setFuel(parseFloat(e.target.value))}
                            InputProps={{
                                endAdornment: <Typography ml={1}>л</Typography>,
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Присадки (%)"
                            type="number"
                            value={additives}
                            onChange={(e) => setAdditives(parseFloat(e.target.value))}
                            InputProps={{
                                endAdornment: <Typography ml={1}>%</Typography>,
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Текущее содержание этанола (%)"
                            type="number"
                            value={currentMix}
                            onChange={(e) => setCurrentMix(parseFloat(e.target.value))}
                            InputProps={{
                                endAdornment: <Typography ml={1}>%</Typography>,
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Целевое содержание этанола (%)"
                            type="number"
                            value={targetMix}
                            onChange={(e) => setTargetMix(parseFloat(e.target.value))}
                            InputProps={{
                                endAdornment: <Typography ml={1}>%</Typography>,
                            }}
                        />
                    </Grid>
                </Grid>

                <Box mt={3} textAlign="center">
                    <Typography variant="h6">
                        Необходимо добавить:{" "}
                        <strong>{calculateEthanol()}</strong> литров этанола.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}

export default App;
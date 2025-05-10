import React, {useEffect, useState} from "react";
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Typography,
    TextField,
    Container,
    Paper,
    Grid,
    Alert,
} from "@mui/material";

function App() {
    // Состояние для темы (оставляем только темную тему)
    const theme = createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: "#00e0ff", // Голубой цвет для текста
            },
            secondary: {
                main: "#2c3e50", // Темно-синий фон
            },
        },
    });

    const savedValues = JSON.parse(localStorage.getItem("inputValues")) || {
        initialVolume: 0,
        currentEthanolPercent: 0,
        targetVolume: 0,
        targetEthanolPercent: 0,
        ethanolPurity: 96, // Начальное значение чистоты спирта (96%)
        additivesPercent: 0
    };

    // Состояния для входных данных
    const [initialVolume, setInitialVolume] = useState(savedValues.initialVolume); // Исходный объем смеси
    const [currentEthanolPercent, setCurrentEthanolPercent] = useState(savedValues.currentEthanolPercent); // Текущая концентрация этанола
    const [targetVolume, setTargetVolume] = useState(savedValues.targetVolume); // Итоговый объем смеси (необязательный)
    const [targetEthanolPercent, setTargetEthanolPercent] = useState(savedValues.targetEthanolPercent); // Целевая концентрация этанола
    const [ethanolPurity, setEthanolPurity] = useState(savedValues.ethanolPurity); // Чистота спирта
    const [additivesPercent, setAdditivesPercent] = useState(savedValues.additivesPercent); // Процент присадок

    // Состояние для ошибок
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);


    useEffect(() => {
        localStorage.setItem(
            "inputValues",
            JSON.stringify({ initialVolume, currentEthanolPercent, targetVolume, targetEthanolPercent, ethanolPurity, additivesPercent })
        );
    }, [initialVolume, currentEthanolPercent, targetVolume, targetEthanolPercent, ethanolPurity, additivesPercent]);
    
    // Функция для расчета добавляемых компонентов
    const calculateResults = () => {
        // Преобразуем строки в числа
        const initialVol = parseFloat(initialVolume);
        const currentEthanol = parseFloat(currentEthanolPercent);
        const targetVol = parseFloat(targetVolume);
        const targetEthanol = parseFloat(targetEthanolPercent);
        const ethanolPure = parseFloat(ethanolPurity);
        const additives = parseFloat(additivesPercent);

        // Проверка на корректность ввода
        if (
            isNaN(initialVol) ||
            isNaN(currentEthanol) ||
            isNaN(targetEthanol) ||
            isNaN(ethanolPure) ||
            isNaN(additives)
        ) {
            setError("Все значения должны быть заполнены.");
            setResult(null);
            return;
        }
        if (
            initialVol <= 0 ||
            currentEthanol < 0 ||
            targetEthanol < 0 ||
            ethanolPure <= 0 ||
            additives < 0
        ) {
            setError("Все значения должны быть положительными.");
            setResult(null);
            return;
        }
        if (
            currentEthanol > 100 ||
            targetEthanol > 100 ||
            ethanolPure > 100 ||
            additives > 100
        ) {
            setError("Значения процентов не могут превышать 100.");
            setResult(null);
            return;
        }

        setError(""); // Очищаем ошибку, если данные корректны

        // Если итоговый объем указан
        if (!isNaN(targetVol)) {
            const fuelFactor = (100 + additives) / 100 + (200 - ethanolPure) / 100 * targetEthanol / (100 - targetEthanol);
            const targetPureFuelVolume = targetVol / fuelFactor;
            
            const targetPureEthanolVolume = targetEthanol * targetPureFuelVolume/(100 - targetEthanol) ;
            
            const targetFuelVolume =  targetPureFuelVolume * 100 / (100 - additives);

            const targetEthanolVolume =  targetPureEthanolVolume * 100 / ethanolPure;

          
            
            // Исходные объемы этанола и бензина
            const initialPureFuelVolume = initialVol / ((100+additives)/100+ (200 - ethanolPure)/100 * currentEthanol /(100 - currentEthanol) );
            const initialPureEthanolVolume = currentEthanol * initialPureFuelVolume / (100 - currentEthanol);

            const initialFuelVolume =  initialPureFuelVolume * 100 / (100 - additives);

            const initialEthanolVolume =  initialPureEthanolVolume * 100 / ethanolPure;

            // Необходимый объем этанола для добавления
            const ethanolToAddVolume = targetEthanolVolume - initialEthanolVolume;

           
            // Объем бензина для добавления
            const fuelToAddVolume = targetFuelVolume - initialFuelVolume;
            
            // Проверка на отрицательный объем
            if (fuelToAddVolume < 0 || ethanolToAddVolume < 0) {
                setError(
                    "Невозможно достичь целевого объема с заданными параметрами. Уменьшите процент присадок или измените другие параметры."
                );
                setResult(null);
                return;
            }

            // Результаты
            setResult({
                ethanolToAddVolume: ethanolToAddVolume.toFixed(2),
                fuelToAddVolume: fuelToAddVolume.toFixed(2),
            });
        } else {
            // Если итоговый объем не указан
            if (targetEthanol > currentEthanol) {
                // Повышение концентрации этанола -> добавляем спирт
                const ethanolNeededMass =
                    (initialVol * (targetEthanol - currentEthanol)) /
                    (100 - targetEthanol);
                const ethanolToAddVolume =
                    ethanolNeededMass / ((ethanolPure / 100) * 0.789); // Плотность этанола ~0.789

                setResult({
                    ethanolToAddVolume: ethanolToAddVolume.toFixed(2),
                    fuelToAddVolume: "0.00", // Бензин не добавляется
                });
            } else if (targetEthanol < currentEthanol) {
                // Понижение концентрации этанола -> добавляем бензин
                const pureFuelToAddVolume =
                    (initialVol * (currentEthanol - targetEthanol)) / targetEthanol;

                const fuelToAddVolume = pureFuelToAddVolume * 100 / (100 - additives);
                setResult({
                    ethanolToAddVolume: "0.00", // Спирт не добавляется
                    fuelToAddVolume: fuelToAddVolume.toFixed(2),
                });
            } else {
                // Концентрация не меняется
                setResult({
                    ethanolToAddVolume: "0.00",
                    fuelToAddVolume: "0.00",
                });
            }
        }
    };
   
    useEffect(() => {
        calculateResults();
    }, [initialVolume, currentEthanolPercent, targetVolume, targetEthanolPercent, ethanolPurity, additivesPercent]);
    return (
        <ThemeProvider theme={theme}>
            {/* CssBaseline обеспечивает базовые стили для темы */}
            <CssBaseline />
            <Container  sx={{ mt: 5 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 8,
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.main,
                    }}
                >
                    <Box textAlign="center" mb={3}>
                        <Typography variant="h4" gutterBottom>
                            Калькулятор смеси этанола и бензина
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Рассчитайте количество бензина и спирта для получения целевой смеси
                        </Typography>
                    </Box>

                    {/* Вывод сообщения об ошибке */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Разделение формы на две части */}
                    <Grid container spacing={2}>
                        {/* Левая часть формы */}
                        <Grid item size={{ xs: 12, md:12}}>
                            <Typography variant="h6">Исходные параметры</Typography>

                            {/* Исходный объем смеси */}
                            <Box mt={2}>
                                <Typography variant="body1">Исходный объем смеси (л)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={initialVolume}
                                    onChange={(e) => setInitialVolume(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>л</Typography>,
                                    }}
                                />
                            </Box>

                            {/* Текущая концентрация этанола */}
                            <Box mt={2}>
                                <Typography variant="body1">Текущая концентрация этанола (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={currentEthanolPercent}
                                    onChange={(e) => setCurrentEthanolPercent(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                />
                            </Box>

                            {/* Чистота спирта */}
                            <Box mt={2}>
                                <Typography variant="body1">Чистота спирта (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={ethanolPurity}
                                    onChange={(e) => setEthanolPurity(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                />
                            </Box>

                            {/* Присадки */}
                            <Box mt={2}>
                                <Typography variant="body1">Присадки (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={additivesPercent}
                                    onChange={(e) => setAdditivesPercent(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                />
                            </Box>
                        </Grid>

                        {/* Правая часть формы */}
                        <Grid item size={{ xs: 12, md:12}}>
                            <Typography variant="h6">Целевые параметры</Typography>

                            {/* Итоговый объем смеси (необязательный) */}
                            <Box mt={2}>
                                <Typography variant="body1">
                                    Итоговый объем смеси (л) (необязательно)
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={targetVolume}
                                    onChange={(e) => setTargetVolume(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>л</Typography>,
                                    }}
                                />
                            </Box>

                            {/* Целевая концентрация этанола */}
                            <Box mt={2}>
                                <Typography variant="body1">Целевая концентрация этанола (%)</Typography>
                                <TextField
                                    fullWidth
                                    type="number"
                                    value={targetEthanolPercent}
                                    onChange={(e) => setTargetEthanolPercent(e.target.value)}
                                    InputProps={{
                                        endAdornment: <Typography ml={1}>%</Typography>,
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Отображение результатов */}
                    {result && (
                        <Box mt={3}>
                            <Typography variant="h6">Результат:</Typography>
                            {result.ethanolToAddVolume && (
                                <Typography variant="body1">
                                    Необходимо добавить:{" "}
                                    <strong>{result.ethanolToAddVolume} л</strong> спирта.
                                </Typography>
                            )}
                            {result.fuelToAddVolume && (
                                <Typography variant="body1">
                                    Необходимо добавить:{" "}
                                    <strong>{result.fuelToAddVolume} л</strong> бензина.
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>
            </Container>
        </ThemeProvider>
    );
}

export default App;
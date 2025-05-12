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
import Decimal from "decimal.js";

function App() {
    // Состояние для темы (оставляем только темную тему)
    const theme = createTheme({
        palette: {
            mode: "dark",
            primary: {
                main: "#00e0ff", // Голубой цвет для текста
            },
            background: {
                default: "#2c3e50", // Темно-синий фон всей страницы
                paper: "#2c3e50", // Цвет Paper такой же, как фон страницы
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: "#2c3e50", // Цвет Paper
                        color: "#ffffff", // Белый текст
                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)", // Тень для Paper
                    },
                },
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

    Decimal.set({rounding: Decimal.ROUND_HALF_EVEN});

    useEffect(() => {
        localStorage.setItem(
            "inputValues",
            JSON.stringify({
                initialVolume,
                currentEthanolPercent,
                targetVolume,
                targetEthanolPercent,
                ethanolPurity,
                additivesPercent
            })
        );
    }, [initialVolume, currentEthanolPercent, targetVolume, targetEthanolPercent, ethanolPurity, additivesPercent]);


    useEffect(() => {
        // Функция для расчета добавляемых компонентов
        const calculateResults = () => {
            // Преобразуем строки в числа
            const initialVol = new Decimal(initialVolume || 0);
            const currentEthanol = new Decimal(currentEthanolPercent || 0);
            const targetVol = new Decimal(targetVolume || 0);
            const targetEthanol = new Decimal(targetEthanolPercent || 0);
            const ethanolPure = new Decimal(ethanolPurity || 0);
            const additives = new Decimal(additivesPercent || 0);

            // Проверка на корректность ввода
            if (
                initialVol.lte(0) ||
                currentEthanol.lt(0) ||
                targetEthanol.lt(0) ||
                ethanolPure.lte(0) ||
                additives.lt(0)
            ) {
                setError("Все значения должны быть положительными.");
                setResult(null);
                return;
            }
            if (
                currentEthanol.gt(100) ||
                targetEthanol.gt(100) ||
                ethanolPure.gt(100) ||
                additives.gt(100)
            ) {
                setError("Значения процентов не могут превышать 100.");
                setResult(null);
                return;
            }

            setError(""); // Очищаем ошибку, если данные корректны

            // Если итоговый объем указан
            if (!targetVol.isZero()) {
                const fuelFactor = new Decimal(1)
                    .plus(additives.div(100))
                    .plus(
                        targetEthanol
                            .mul(new Decimal(200).minus(ethanolPure))
                            .div(new Decimal(100).mul(new Decimal(100).minus(targetEthanol)))
                    );

                // Целевой объем чистого бензина
                const targetPureFuelVolume = targetVol.div(fuelFactor);

                // Целевой объем чистого этанола
                const targetPureEthanolVolume = targetEthanol
                    .mul(targetPureFuelVolume)
                    .div(new Decimal(100).minus(targetEthanol));

                // Целевой объем бензина (с учетом присадок)
                const targetFuelVolume = targetPureFuelVolume
                    .mul(additives.div(100).plus(1));

                // Целевой объем этанола (с учетом чистоты спирта)
                const targetEthanolVolume = targetPureEthanolVolume
                    .mul(new Decimal(2).minus(ethanolPure.div(100)));

                // Исходные объемы
                const initialPureFuelVolume = initialVol.div(
                    new Decimal(1)
                        .plus(additives.div(100))
                        .plus(
                            currentEthanol
                                .mul(new Decimal(200).minus(ethanolPure))
                                .div(new Decimal(100).mul(new Decimal(100).minus(currentEthanol)))
                        )
                );


                const initialPureEthanolVolume = currentEthanol
                    .mul(initialPureFuelVolume)
                    .div(new Decimal(100).minus(currentEthanol));

                const initialFuelVolume = initialPureFuelVolume
                    .mul(additives.div(100).plus(1));

                const initialEthanolVolume = initialPureEthanolVolume
                    .mul(new Decimal(2).minus(ethanolPure.div(100)));

                // Необходимый объем этанола для добавления
                const ethanolToAddVolume = targetEthanolVolume.minus(initialEthanolVolume);

                // Объем бензина для добавления
                const fuelToAddVolume = targetFuelVolume.minus(initialFuelVolume);

                // Проверка на отрицательный объем
                if (fuelToAddVolume.lt(0) || ethanolToAddVolume.lt(0)) {
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
                // Исходная смесь
                const initialPureFuelVolume = initialVol.div(
                    new Decimal(1)
                        .plus(additives.div(100))
                        .plus(
                            currentEthanol
                                .mul(new Decimal(200).minus(ethanolPure))
                                .div(new Decimal(100).mul(new Decimal(100).minus(currentEthanol)))
                        )
                );


                const initialPureEthanolVolume = currentEthanol
                    .mul(initialPureFuelVolume)
                    .div(new Decimal(100).minus(currentEthanol));

                const initialFuelVolume = initialPureFuelVolume
                    .mul(additives.div(100).plus(1));
                

                // Расчет добавляемых компонентов
                if (targetEthanol.gt(currentEthanol)) {
                    // Повышение концентрации -> добавляем спирт
                    // Целевая смесь
                    const targetPureEthanolVolume = initialPureFuelVolume.mul(
                        targetEthanol.div(new Decimal(100).minus(targetEthanol)));

                    const ethanolToAddVolume = targetPureEthanolVolume
                        .minus(initialPureEthanolVolume)
                        .div(ethanolPure.div(100));
                    setResult({
                        ethanolToAddVolume: ethanolToAddVolume.toFixed(2),
                        fuelToAddVolume: "0.00",
                    });
                } else if (targetEthanol.lt(currentEthanol)) {
                    // Понижение концентрации -> добавляем топливо
                    const targetPureFuelVolume = initialPureEthanolVolume.mul(new Decimal(100).div(targetEthanol).minus(1));
                    const targetFuelVolume = targetPureFuelVolume
                        .mul(additives.div(100).plus(1));

                    // Объем бензина для добавления
                    const fuelToAddVolume = targetFuelVolume.minus(initialFuelVolume);

                    // Результаты
                    setResult({
                        ethanolToAddVolume:  "0.00",
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

        calculateResults();
    }, [initialVolume, currentEthanolPercent, targetVolume, targetEthanolPercent, ethanolPurity, additivesPercent]);
    return (
        <ThemeProvider theme={theme}>
            {/* CssBaseline обеспечивает базовые стили для темы */}
            <CssBaseline/>
            <Container sx={{mt: 5}}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 8,
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
                        <Alert severity="error" sx={{mb: 3}}>
                            {error}
                        </Alert>
                    )}

                    {/* Разделение формы на две части */}
                    <Grid container spacing={2}>
                        {/* Левая часть формы */}
                        <Grid item size={{xs: 12, md: 12}}>
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
                        <Grid item size={{xs: 12, md: 12}}>
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
Dokumentacja gry przeglądarkowej Bingo.
1. Opis ogólny gry
Bingo to przeglądarkowa gra logiczna typu Connect Four, w której gracze na przemian
wrzucają pionki do pionowej planszy. Celem jest ułożenie czterech pionków w jednej
linii (poziomej, pionowej lub ukośnej).
Gra dostępna jest w trzech trybach:
• przeciwko komputerowi,
• lokalnie (hot-seat),
• online (multiplayer).
Aplikacja zostanie zrealizowana w frameworku Flask.
2. Tryby rozgrywki
2.1. Gra 1 na 1 z komputerem
• Gracz rywalizuje z komputerem.
• Komputer wykonuje ruchy:
o losowe (poziom łatwy),
o lub regułowe (blokowanie zwycięstwa gracza, próba wygranej).
• Gracz zawsze wykonuje ruch jako pierwszy (opcjonalnie losowanie).
2.2. Hot-seat (1 na 1 przy jednym komputerze)
• Dwóch graczy korzysta z jednej myszki.
• Gracze wykonują ruchy naprzemiennie.
• Każdy gracz ma:
o przypisany kolor pionków (czerwony i żółty).
• Interfejs jasno wskazuje, czyja jest kolej.
2.3. Multiplayer (online)
• Dwóch graczy na różnych komputerach.
• Funkcjonalności:
o tworzenie pokoju gry,
o dołączanie do gry przez kod pokoju,
o synchronizacja ruchów w czasie rzeczywistym.
• Ruch jednego gracza natychmiast aktualizuje planszę drugiego.
3. Zasady gry
1. Plansza ma rozmiar 7 kolumn × 6 wierszy.
2. Gracze wykonują ruchy naprzemiennie.
3. W swojej turze gracz:
a. wybiera kolumnę,
b. pionek „spada” na najniższe wolne pole.
4. Celem gry jest ułożenie 4 pionków w jednej linii:
a. poziomej,
b. pionowej,
c. ukośnej.
5. Gra kończy się:
a. zwycięstwem jednego z graczy,
b. remisem (zapełniona plansza bez zwycięzcy).
4. Schematyczny wygląd gry
4.1. Plansza
• Plansza pionowa: 7 kolumn × 6 rzędów
• Pola:
o puste – białe,
o gracz 1 – czerwone,
o gracz 2 – żółte.
| O O O O O O O |
| O O O O O O O |
| O O O O O O O |
| O O O O O O O |
| O O O O O O O |
| O O O O O O O |
 1 2 3 4 5 6 7
4.2. Elementy interfejsu
• plansza gry,
• informacja o aktualnym graczu,
• kolor pionka gracza,
• przyciski:
o „Nowa gra”,
o „Wyjdź do menu”.
5. Plan podziału aplikacji na podstrony
5.1. Strona główna
• nazwa gry,
• wybór trybu gry:
o vs komputer,
o hot-seat,
o multiplayer,
• przycisk „Instrukcja”.
5.2. Instrukcja
• opis zasad gry,
• warunki zwycięstwa,
• wyjaśnienie sterowania.
5.3. Ekran gry
• plansza 7×6,
• obsługa kliknięć kolumn,
• logika spadania pionków,
• sprawdzanie zwycięstwa.
5.4. Lobby multiplayer
• tworzenie pokoju,
• dołączanie do pokoju,
• oczekiwanie na drugiego gracza.
5.5. Ekran zakończenia gry
• komunikat o zwycięzcy lub remisie,
• przycisk „Rewanż”,
• powrót do menu.
6. Plan zapisu danych
6.1. Dane gracza
• player_id
• nickname
• color (red / yellow)
• is_ai
6.2. Dane gry
• game_id
• game_mode
• status
• current_player
• board_state (macierz 6×7)
6.3. Stan planszy
• tablica 2D:
o 0 – puste pole
o 1 – gracz 1
o 2 – gracz 2
6.4. Technologie zapisu
• SQLite (lokalnie),
• sesje Flask do hot-seat i AI,
• WebSockety (Flask-SocketIO) dla multiplayera.
7. Technologie
• Backend: Python + Flask
• Frontend: HTML, CSS, JavaScript
• Baza danych: SQLite
• Multiplayer: Flask-SocketIO